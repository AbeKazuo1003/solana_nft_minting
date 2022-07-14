use anchor_lang::prelude::*;
use crate::{MintNFT, ErrorCode, InitMemberAccount};

pub fn init_member_available(accounts: &InitMemberAccount) -> Result<()> {
    if accounts.config.freeze_program {
        return err!(ErrorCode::FreezeProgramError);
    }
    if accounts.config.mint_mode == 0 {
        return err!(ErrorCode::SaleClosedError);
    }
    Ok(())
}

pub fn mint_presale_available(accounts: &MintNFT) -> Result<()> {
    let now_ts = Clock::get().unwrap().unix_timestamp;
    if accounts.config.freeze_program {
        return err!(ErrorCode::FreezeProgramError);
    }

    if accounts.token_config.freeze {
        return err!(ErrorCode::FreezeTokenError);
    }

    if accounts.config.mint_mode != 1 {
        return err!(ErrorCode::PresaleClosedError);
    }

    if (now_ts as u64) < (accounts.config.start_date) {
        return err!(ErrorCode::SaleNotStartedError);
    }

    if (now_ts as u64) > (accounts.config.end_date) {
        return err!(ErrorCode::SaleEndedError);
    }

    if accounts.member.presale_count + 1 > accounts.config.presale_per_user {
        return err!(ErrorCode::MaxPresaleExceedError);
    }

    if accounts.config.supply + 1 > accounts.config.max_supply {
        return err!(ErrorCode::MaxSupplyExceedError);
    }
    Ok(())
}

pub fn mint_public_sale_available(accounts: &MintNFT) -> Result<()> {
    let now_ts = Clock::get().unwrap().unix_timestamp;
    if accounts.config.freeze_program {
        return err!(ErrorCode::FreezeProgramError);
    }

    if accounts.token_config.freeze {
        return err!(ErrorCode::FreezeTokenError);
    }

    if accounts.config.mint_mode != 2 {
        return err!(ErrorCode::PublicSaleClosedError);
    }

    if (now_ts as u64) < (accounts.config.start_date) {
        return err!(ErrorCode::SaleNotStartedError);
    }

    if (now_ts as u64) > (accounts.config.end_date) {
        return err!(ErrorCode::SaleEndedError);
    }

    if accounts.member.public_count + 1 > accounts.config.public_sale_per_user {
        return err!(ErrorCode::MaxPublicSaleExceedError);
    }

    if accounts.config.supply + 1 > accounts.config.max_supply {
        return err!(ErrorCode::MaxSupplyExceedError);
    }
    Ok(())
}


