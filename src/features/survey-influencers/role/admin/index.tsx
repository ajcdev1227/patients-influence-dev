/* eslint-disable import/no-unresolved */
import { EnumsApi, PlatformProductAPI, SurveyAPI } from 'api';
import { useMenu, useModal, usePagination, useSnackbar } from 'hooks';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { CardWithText, NewCheckboxTable } from 'components/custom';
import { Stack } from 'components/system';
import { Label, Pagination } from 'components/ui';
import { TTableRenderItemObject } from 'components/custom/table/types';
import { BackupTableRounded } from '@mui/icons-material';
import { AddIcon, DeleteIcon, VerticalDotsIcon } from 'components/svg';
import {
  IPlatformSurveyInfluencers,
  ISingleProductOrderSurvey,
} from 'api/platformProduct/types';
import Chip from 'components/ui/chip';
import { useAppContext } from 'context';
import { formatLongString } from 'utilities/string-converter';
import { Tooltip } from '@mui/material';
import {
  calculateAge,
  getDiseasesAsCommaSeparatedString,
} from 'features/discover-influencers/role/admin/helpers';
import { AxiosError } from 'axios';
import { TSelectFieldType } from 'features/discover-influencers/role/admin/elements/influencer-profile/types';
import { ProductOrderInfluencerStatus } from 'api/platformProduct/enums';
import {
  ISpan,
  ProductInfluencersPageMain,
  ToBeApprovedActionsMenu as CustomActionsMenu,
  InfluencerNumberWrapper,
  TableTooltip,
} from './styles';
import {
  DProductAdminInfluencersHead,
  DProductClientInfluencersHead,
} from './data';
import PromptModal from './elements/prompt-modal';

const SurveyInfluencersPage = ({ id }: { id: string }) => {
  const { role } = useAppContext();
  const [survey, setSurvey] = useState<ISingleProductOrderSurvey>();
  const [surveyInfluencers, setSurveyInfluencers] = useState<
    IPlatformSurveyInfluencers[]
  >([]);

  const [checkedPlatformInfluencers, setCheckedPlatformInfluencers] = useState<
    number[]
  >([]);

  const [checkedInfluencers, setCheckedInfluencers] = useState<number[]>([]);
  const [numberOfInfluencers, setNumberOfInfluencers] = useState<number>(0);
  const [ethnicities, setEthnicities] = useState<TSelectFieldType[]>([]);

  const routes = useRouter();

  const getEthnicity = async () => {
    const result = await EnumsApi.getEthnicities();

    setEthnicities(
      result.map((x: any) => ({
        value: x.id,
        label: x.name,
      }))
    );
  };

  const toggleAllCheckedInfluencers = (checked: boolean) => {
    if (checked) {
      const currentPageIds = surveyInfluencers.map((row) => row.id);
      const currentPageInfluencerIds = surveyInfluencers.map(
        (row) => row.influencerId
      );

      const newSelectedRows = Array.from(
        new Set([...checkedPlatformInfluencers, ...currentPageIds])
      );

      const newSelectedInfluencerRows = Array.from(
        new Set([...checkedInfluencers, ...currentPageInfluencerIds])
      );
      setCheckedPlatformInfluencers(newSelectedRows);
      setCheckedInfluencers(newSelectedInfluencerRows);
    } else {
      // Deselect all rows on the current page
      const currentPageIds = surveyInfluencers.map((row) => row.id);
      const currentPageInfluencerIds = surveyInfluencers.map(
        (row) => row.influencerId
      );
      const newSelectedRows = checkedPlatformInfluencers.filter(
        (rowId) => !currentPageIds.includes(rowId)
      );
      const newSelectedInfluencerRows = checkedInfluencers.filter(
        (rowId) => !currentPageInfluencerIds.includes(rowId)
      );

      setCheckedPlatformInfluencers(newSelectedRows);
      setCheckedInfluencers(newSelectedInfluencerRows);
    }
  };

  const toggleInfluencer = (rowId: number, checked: boolean) => {
    if (checked) {
      const selectedInfluencer = surveyInfluencers.find(
        (influencer) => influencer.id === rowId
      );

      if (selectedInfluencer) {
        setCheckedInfluencers([
          ...checkedInfluencers,
          selectedInfluencer.influencerId,
        ]);
      }
      setCheckedPlatformInfluencers([...checkedPlatformInfluencers, rowId]);
    } else {
      const selectedInfluencer = surveyInfluencers.find(
        (influencer) => influencer.id === rowId
      );

      if (selectedInfluencer) {
        setCheckedInfluencers([
          ...checkedInfluencers,
          selectedInfluencer.influencerId,
        ]);
      }

      setCheckedPlatformInfluencers(
        checkedPlatformInfluencers.filter(
          (influencerId) => influencerId !== rowId
        )
      );

      if (selectedInfluencer) {
        setCheckedInfluencers(
          checkedInfluencers.filter(
            (influencerId) => influencerId !== selectedInfluencer.influencerId
          )
        );
      }
    }
  };

  const { pagesCount, page, setTotalResults, handlePageChange, reload } =
    usePagination({
      limit: 10,
      page: 1,
      onChange: async (params, setPage) => {
        const { result, meta } =
          // TODO Remove this and swap it with version for survey type response
          await PlatformProductAPI.getPlatformProductOrderSurveyInfluencers(
            +id,
            {
              limit: params.limit,
              skip: params.skip,
            }
          );

        setPage(params.page);

        setSurveyInfluencers(result);
        setTotalResults(meta.countFiltered);
        setNumberOfInfluencers(meta.countFiltered);
      },
    });

  // Table New Checkbox Modal controlls
  const [tableModal, openTableModal, closeTableModal] = useModal(false);

  const [menu, open, setOpen, buttonRegRef, position] = useMenu(false);

  const { push } = useSnackbar();

  const [removeBulkInfModal, openRemoveBulkInfModal, closeRemoveBulkInfModal] =
    useModal(false);

  const handleMenu = () => {
    setOpen((prevState: boolean) => !prevState);
  };

  const handleBulkInfluencerRemoval = async () => {
    if (survey && checkedInfluencers.length) {
      SurveyAPI.removeInfluencersFromSurvey(survey.id, checkedInfluencers)
        .then(() => {
          push('Successfully removed influencers from a survey.', {
            variant: 'success',
          });
          setCheckedInfluencers([]);
          setCheckedPlatformInfluencers([]);
          reload();
        })
        .catch(() => {
          push('Something went wrong!', { variant: 'error' });
        });
    } else {
      push('Please select influencers!', { variant: 'warning' });
    }
  };

  const handleBulkInfluencerInvitations = async () => {
    if (survey && checkedInfluencers.length) {
      SurveyAPI.inviteInfluencersToSurvey(survey.id, checkedInfluencers)
        .then(() => {
          push('Successfully invited influencers to a survey', {
            variant: 'success',
          });
          setCheckedInfluencers([]);
          setCheckedPlatformInfluencers([]);
          reload();
        })
        .catch((err) => {
          const error = err as AxiosError<any>;
          if (
            error?.response?.data.statusCode === 400 &&
            error?.response?.data.message ===
              "Influencer [object Object] doesn't have valid state to be invited"
          ) {
            push("Selected influencers can't be invited!", {
              variant: 'error',
            });
          } else {
            push('Something went wrong here!', { variant: 'error' });
          }
        });
    } else {
      push('Please select influencers to invite', { variant: 'warning' });
    }
  };

  const renderItem = ({ headItem, row }: TTableRenderItemObject) => {
    const productInfluencer = row.data as IPlatformSurveyInfluencers;

    if (headItem.reference === 'username') {
      const stakeholder = productInfluencer.influencer.stakeholders.find(
        (stakeholderObj) => stakeholderObj.socialPlatformId === 1
      );
      return stakeholder
        ? stakeholder.socialPlatformUsername
        : 'No Social Media';
    }
    if (headItem.reference === 'firstName' && role !== 'CLIENT') {
      return productInfluencer.influencer.user.firstName;
    }

    if (headItem.reference === 'lastName' && role !== 'CLIENT') {
      return productInfluencer.influencer.user.lastName;
    }
    if (headItem.reference === 'diseaseAreas') {
      if (productInfluencer.influencer.influencerDiseaseAreas) {
        const formattedDiseases = getDiseasesAsCommaSeparatedString(
          productInfluencer.influencer.influencerDiseaseAreas
        );

        const formattedElipsisString = formatLongString(formattedDiseases, 50);
        return (
          <Tooltip
            style={{ cursor: 'pointer' }}
            title={<TableTooltip>{formattedDiseases}</TableTooltip>}
          >
            <span>{formattedElipsisString}</span>
          </Tooltip>
        );
      }
    }
    if (headItem.reference === 'location') {
      if (!productInfluencer.influencer.user.location) {
        return '';
      }
      const { location } = productInfluencer.influencer.user;
      const label = location.country
        ? `${location.name}, ${location.country.name}`
        : location.name;

      return label;
    }

    if (headItem.reference === 'age') {
      if (!productInfluencer.influencer.dateOfBirth) {
        return '';
      }
      // return calculateAge(row.data.dateOfBirth);
      const age = calculateAge(productInfluencer.influencer.dateOfBirth);
      if (
        role === 'CLIENT' &&
        (productInfluencer.status <= 1 || productInfluencer.status === 3)
      ) {
        switch (true) {
          case age >= 0 && age < 10:
            return '0-9';
          case age >= 10 && age < 20:
            return '10-19';
          case age >= 20 && age < 30:
            return '20-29';
          case age >= 30 && age < 40:
            return '30-39';
          case age >= 40 && age < 50:
            return '40-49';
          case age >= 50 && age < 60:
            return '50-59';
          case age >= 60 && age < 70:
            return '60-69';
          case age >= 70 && age < 80:
            return '70-79';
          case age >= 80 && age < 90:
            return '80-89';
          case age >= 90 && age <= 100:
            return '90-100';
          default:
            return 'Unknown';
        }
      }

      if (
        role === 'ADMIN' ||
        role === 'SUPERADMIN' ||
        (role === 'CLIENT' && productInfluencer.status > 1)
      ) {
        return age;
      }
    }

    if (headItem.reference === 'gender') {
      switch (productInfluencer.influencer.gender) {
        case 0:
          return 'Male';
        case 1:
          return 'Female';
        case 2:
          return 'Other';
        default:
          return '';
      }
    }
    if (headItem.reference === 'ethnicity' && ethnicities) {
      const ethnicity = productInfluencer.influencer.ethnicityId
        ? ethnicities.find(
            (ethnicityItem) =>
              ethnicityItem.value === productInfluencer.influencer.ethnicityId
          )
        : undefined;
      return ethnicity ? ethnicity.label : '';
    }

    if (headItem.reference === 'agreedAmount' && role !== 'CLIENT') {
      return `CHF ${productInfluencer.agreedAmount}`;
    }
    if (headItem.reference === 'status') {
      switch (productInfluencer.status) {
        case ProductOrderInfluencerStatus.Added:
          return <Chip type="neutral" size="small" label="Added" />;
        case ProductOrderInfluencerStatus.Invited:
          return <Chip type="secondary" size="small" label="Invited" />;
        case ProductOrderInfluencerStatus.Matching:
          return <Chip type="primary" size="small" label="Matching" />;
        case ProductOrderInfluencerStatus.NotSelected:
          return <Chip type="danger" size="small" label="Not Selected" />;
        case ProductOrderInfluencerStatus.Withdrawn:
          return <Chip type="danger" size="small" label="Left" />;
        case ProductOrderInfluencerStatus.Declined:
          return <Chip type="danger" size="small" label="Declined" />;
        case ProductOrderInfluencerStatus.ToBeSubmitted:
          return <Chip type="default" size="small" label="To Be Submitted" />;
        case ProductOrderInfluencerStatus.ToBeApproved:
          return <Chip type="primary" size="small" label="Submitted" />;
        case ProductOrderInfluencerStatus.Approved:
          return <Chip type="success" size="small" label="Approved" />;
        case ProductOrderInfluencerStatus.NotApproved:
          return <Chip type="danger" size="small" label="Not Approved" />;
        case ProductOrderInfluencerStatus.ToBePaid:
          return <Chip type="default" size="small" label="To Be Paid" />;
        case ProductOrderInfluencerStatus.Removed:
          return <Chip type="danger" size="small" label="Removed" />;
        case ProductOrderInfluencerStatus.ToBeAnswered:
          if (survey?.platformProductOrder.status === 0) {
            return <Chip type="default" size="small" label="Pending" />;
          }
          return <Chip type="primary" size="small" label="To Be Answered" />;
        default:
          return '';
      }
    }

    if (headItem.reference === 'followers') {
      const stakeholder = productInfluencer.influencer.stakeholders.find(
        (stakeholderObj) => stakeholderObj.socialPlatformId === 1
      );
      return stakeholder ? stakeholder.followersCount : 'No Social Media';
    }

    if (headItem.reference === 'email' && role !== 'CLIENT') {
      return row.data.influencer.user.email;
    }

    if (headItem.reference === 'actions') {
      return '';
    }

    return '';
  };

  const getSurveyDetails = async () => {
    PlatformProductAPI.getPlatformsSurvey(+id).then((data) => {
      setSurvey(data);
    });
  };

  React.useEffect(() => {
    getSurveyDetails();
    getEthnicity();
  }, []);

  const [iModal, openIModal, closeIModal] = useModal(false);

  const initialBulkActions = [
    // {
    //   icon: <ContactIcon />,
    //   label: 'Contact',
    //   action: () => {
    //     openContactModal();
    //     handleMenu();
    //   },
    // },
    // {
    //   icon: <EditIcon />,
    //   label: 'Note',
    //   action: () => {
    //     openNoteModal();
    //     handleMenu();
    //   },
    // },
    // {
    //   icon: <ScheduleIcon />,
    //   label: 'Schedule',
    //   action: () => {
    //     openScheduleModal();
    //     handleMenu();
    //   },
    // },
    {
      icon: <AddIcon />,
      label: 'Invite',
      action: () => {
        handleMenu();
        openIModal();
      },
    },
    {
      icon: <BackupTableRounded />,
      label: 'Columns',
      action: () => {
        handleMenu();
        openTableModal();
      },
    },
    {
      icon: <DeleteIcon />,
      label: 'Remove',
      action: () => {
        handleMenu();
        openRemoveBulkInfModal();
      },
    },
  ];

  const [bulkActions, setBulkActions] = useState(initialBulkActions);

  useEffect(() => {
    setBulkActions((prevState) =>
      prevState.filter((action) => {
        if (action.label === 'Invite') {
          return !!(role === 'SUPERADMIN' || role === 'ADMIN');
        }
        return true;
      })
    );
  }, []);

  return (
    <ProductInfluencersPageMain>
      <CardWithText
        title={survey && survey.name ? survey.name : ''}
        style={{ gap: 'unset' }}
      >
        <Label style={{ marginBottom: '10px' }}>
          Influencers{' '}
          <InfluencerNumberWrapper>
            {numberOfInfluencers}
          </InfluencerNumberWrapper>
        </Label>
        <Stack>
          <>
            <NewCheckboxTable
              head={
                role === 'CLIENT'
                  ? DProductClientInfluencersHead
                  : DProductAdminInfluencersHead
              }
              items={surveyInfluencers}
              renderItem={renderItem}
              checkedRows={checkedPlatformInfluencers}
              onSingleSelect={toggleInfluencer}
              onSelectAll={toggleAllCheckedInfluencers}
              tableColModal={tableModal}
              closeTableColModal={closeTableModal}
              optionalRole="CLIENT"
              renderElements={
                <>
                  <ISpan onClick={handleMenu} ref={buttonRegRef}>
                    <VerticalDotsIcon />
                  </ISpan>
                  {open && (
                    <CustomActionsMenu
                      position={position}
                      items={bulkActions}
                      ref={menu}
                    />
                  )}
                </>
              }
            />

            <Pagination
              style={{ justifyContent: 'right' }}
              onChange={(_e, x) => handlePageChange(x)}
              page={page}
              count={pagesCount}
            />
          </>
        </Stack>
      </CardWithText>
      {removeBulkInfModal && (
        <PromptModal
          plural
          onClose={() => {
            closeRemoveBulkInfModal();
          }}
          handleAction={handleBulkInfluencerRemoval}
        />
      )}
      {iModal && (
        <PromptModal
          plural
          type="invite"
          target="influencer"
          handleAction={handleBulkInfluencerInvitations}
          onClose={() => {
            closeIModal();
          }}
        />
      )}
    </ProductInfluencersPageMain>
  );
};

export default SurveyInfluencersPage;
